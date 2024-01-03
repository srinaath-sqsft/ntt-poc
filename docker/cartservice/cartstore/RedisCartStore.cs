// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Grpc.Core;
using StackExchange.Redis;
using Google.Protobuf;
using Elastic.Apm.StackExchange.Redis;
using Serilog;

namespace cartservice.cartstore
{
    public class RedisCartStore : ICartStore
    {
        private const string CART_FIELD_NAME = "cart";
        private const int REDIS_RETRY_NUM = 5;

        private volatile ConnectionMultiplexer redis;
        private volatile bool isRedisConnectionOpened = false;

        private readonly object locker = new object();
        private readonly byte[] emptyCartBytes;
        private readonly string connectionString;

        private readonly ConfigurationOptions redisConnectionOptions;

        private Random random = new Random();

        private string slowToggle = Environment.GetEnvironmentVariable("SLOW_TOGGLE");

        public RedisCartStore(string redisAddress)
        {
            // Serialize empty cart into byte array.
            var cart = new Gallivant.Cart();
            emptyCartBytes = cart.ToByteArray();
            connectionString = $"{redisAddress},ssl=false,allowAdmin=true,connectRetry=5";

            redisConnectionOptions = ConfigurationOptions.Parse(connectionString);

            // Try to reconnect if first retry failed (up to 5 times with exponential backoff)
            redisConnectionOptions.ConnectRetry = REDIS_RETRY_NUM;
            redisConnectionOptions.ReconnectRetryPolicy = new ExponentialRetry(100);

            redisConnectionOptions.KeepAlive = 180;
        }

        public Task InitializeAsync()
        {
            EnsureRedisConnected();
            return Task.CompletedTask;
        }

        private void EnsureRedisConnected()
        {
            if (isRedisConnectionOpened)
            {
                return;
            }

            // Connection is closed or failed - open a new one but only at the first thread
            lock (locker)
            {
                if (isRedisConnectionOpened)
                {
                    return;
                }

                Log.Information("Connecting to Redis: {connectionString}", connectionString);
                redis = ConnectionMultiplexer.Connect(redisConnectionOptions);
                redis.UseElasticApm();

                if (redis == null || !redis.IsConnected)
                {
                    Log.Error("Wasn't able to connect to redis");

                    // We weren't able to connect to redis despite 5 retries with exponential backoff
                    throw new ApplicationException("Wasn't able to connect to redis");
                }

                Log.Information("Successfully connected to Redis");
                var cache = redis.GetDatabase();

                Log.Information("Performing small test");
                cache.StringSet("cart", "OK" );
                object res = cache.StringGet("cart");
                Log.Information("Small test result: {res}", res);

                redis.InternalError += (o, e) => { Log.Error("{e}",e.Exception); };
                redis.ConnectionRestored += (o, e) =>
                {
                    isRedisConnectionOpened = true;
                    Log.Information("Connection to redis was restored successfully");
                };
                redis.ConnectionFailed += (o, e) =>
                {
                    Log.Information("Connection failed. Disposing the object");
                    isRedisConnectionOpened = false;
                };

                isRedisConnectionOpened = true;
            }
        }

        public async Task AddItemAsync(string userId, string productId, int quantity, double price, string name, string image)
        {
            Log.Information("AddItemAsync called with userId={userId}, productId={productId}, quantity={quantity}", userId, productId, quantity);

            try
            {
                EnsureRedisConnected();


                
                Log.Information(slowToggle);
                if(slowToggle == "True") {

                    int mseconds = Convert.ToInt32(random.NextDouble() * 5000 + 5000);
                    var transaction = Elastic.Apm.Agent.Tracer.CurrentTransaction;
                    transaction.SetLabel("canaryMetadata", "Cart Sorting enabled");
                    var span = transaction.StartSpan("SORT carts by items", Elastic.Apm.Api.ApiConstants.TypeDb, Elastic.Apm.Api.ApiConstants.SubTypeRedis, Elastic.Apm.Api.ApiConstants.ActionQuery);
                    Log.Information("Sorting cart of user userId={userId}", userId);
                    System.Threading.Thread.Sleep(mseconds);
                    span.End();
                } else
                {
                    var transaction = Elastic.Apm.Agent.Tracer.CurrentTransaction;
                    transaction.SetLabel("canaryMetadata", "Cart Sorting disabled");
                }

                var db = redis.GetDatabase();

                // Access the cart from the cache
                var value = await db.HashGetAsync(userId, CART_FIELD_NAME);

                Gallivant.Cart cart;
                if (value.IsNull)
                {
                    cart = new Gallivant.Cart();
                    cart.UserId = userId;
                    cart.Items.Add(new Gallivant.CartItem { ProductId = productId, Quantity = quantity , Price = price, Name = name, Image = image});
                }
                else
                {
                    cart = Gallivant.Cart.Parser.ParseFrom(value);
                    var existingItem = cart.Items.SingleOrDefault(i => i.ProductId == productId);
                    if (existingItem == null)
                    {
                        cart.Items.Add(new Gallivant.CartItem { ProductId = productId, Quantity = quantity , Price = price, Name = name, Image = image});
                    }
                    else
                    {
                        existingItem.Quantity += quantity;
                    }
                }

                await db.HashSetAsync(userId, new[]{ new HashEntry(CART_FIELD_NAME, cart.ToByteArray()) });
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Can't access cart storage");
                throw new RpcException(new Status(StatusCode.FailedPrecondition, $"Can't access cart storage. {ex}"));
            }
        }

        public async Task EmptyCartAsync(string userId)
        {
            Log.Information("EmptyCartAsync called with userId={userId}", userId);

            try
            {
                EnsureRedisConnected();
                if(slowToggle == "True") {
                    int mseconds = Convert.ToInt32(random.NextDouble() * 5000 + 500);
                    var transaction = Elastic.Apm.Agent.Tracer.CurrentTransaction;
                    var span = transaction.StartSpan("SORT carts by items", Elastic.Apm.Api.ApiConstants.TypeDb, Elastic.Apm.Api.ApiConstants.SubTypeRedis, Elastic.Apm.Api.ApiConstants.ActionQuery);
                    Log.Information("Sorting cart of user userId={userId}", userId);
                    System.Threading.Thread.Sleep(mseconds);
                    span.End();
                }
                var db = redis.GetDatabase();

                // Update the cache with empty cart for given user
                await db.HashSetAsync(userId, new[] { new HashEntry(CART_FIELD_NAME, emptyCartBytes) });
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Can't access cart storage");
                throw new RpcException(new Status(StatusCode.FailedPrecondition, $"Can't access cart storage. {ex}"));
            }
        }

        public async Task<Gallivant.Cart> GetCartAsync(string userId)
        {
            Log.Information("GetCartAsync called with userId={userId}", userId);

            try
            {
                EnsureRedisConnected();

                if(slowToggle == "True") {

                    int mseconds = Convert.ToInt32(random.NextDouble() * 5000 + 500);
                    var transaction = Elastic.Apm.Agent.Tracer.CurrentTransaction;
                    var span = transaction.StartSpan("SORT carts by items", Elastic.Apm.Api.ApiConstants.TypeDb, Elastic.Apm.Api.ApiConstants.SubTypeRedis, Elastic.Apm.Api.ApiConstants.ActionQuery);
                    Log.Information("Sorting cart of user userId={userId}", userId);
                    System.Threading.Thread.Sleep(mseconds);
                    span.End();
                }

                var db = redis.GetDatabase();

                // Access the cart from the cache
                var value = await db.HashGetAsync(userId, CART_FIELD_NAME);

                if (!value.IsNull)
                {
                    return Gallivant.Cart.Parser.ParseFrom(value);
                }

                // We decided to return empty cart in cases when user wasn't in the cache before
                return new Gallivant.Cart();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Can't access cart storage");
                throw new RpcException(new Status(StatusCode.FailedPrecondition, $"Can't access cart storage. {ex}"));
            }
        }

        public bool Ping()
        {
            try
            {
                var cache = redis.GetDatabase();
                var res = cache.Ping();
                return res != TimeSpan.Zero;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}
